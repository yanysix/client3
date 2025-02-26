Vue.component('card', {
    props: ['card'],
    template: `
        <div class="card" :class="{ 'overdue': card.isOverdue, 'completed-in-time': card.isCompletedInTime }">
            <h3>{{ card.title }}</h3>
            <p><strong>Дата создания:</strong> {{ card.createdAt }}</p>
            <p><strong>Последнее редактирование:</strong> {{ card.lastEditedAt }}</p>
            <p><strong>Дэдлайн:</strong> {{ card.deadline }}</p>
            <p><strong>Описание:</strong> {{ card.description }}</p>
            <!-- Отображение статуса -->
            <p v-if="card.isOverdue" class="status overdue">Статус: Просрочена</p>
            <p v-else-if="card.isCompletedInTime" class="status completed-in-time">Статус: Выполнена в срок</p>
            <button @click="$emit('edit-card', card)">Редактировать</button>
            <button @click="$emit('delete-card', card)">Удалить</button>
            <!-- Кнопки перемещения -->
            <button v-if="card.columnIndex === 0" @click="$emit('move-card', card, 1)">Переместить во второй столбец</button>
            <button v-if="card.columnIndex === 1" @click="$emit('move-card', card, 2)">Переместить в третий столбец</button>
            <button v-if="card.columnIndex === 2" @click="returnToSecondColumn(card)">Вернуть во второй столбец</button>
            <button v-if="card.columnIndex === 2" @click="$emit('move-card', card, 3)">Переместить в четвертый столбец</button>
        </div>
    `,
    methods: {
        returnToSecondColumn(card) {
            const reason = prompt('Введите причину возврата:');
            if (reason.trim()) {
                this.$emit('move-card', card, 1, { reason });
            } else {
                alert('Укажите причину возврата!');
            }
        }
    }
});
// Компонент формы создания карточки
Vue.component('card-form', {
    data: function () {
        return {
            title: '',
            description: '',
            deadline: ''
        };
    },
    methods: {
        submitForm() {
            if (!this.title || !this.description || !this.deadline) {
                alert('Заполните все поля!');
                return;
            }

            // Проверяем день недели для дэдлайна
            const selectedDate = new Date(this.deadline);
            const dayOfWeek = selectedDate.getDay();

            if (dayOfWeek === 0 || dayOfWeek === 1) {
                alert('Невозможно установить дэдлайн на воскресенье или понедельник!');
                return;
            }

            // Создаем новую карточку
            const newCard = {
                id: Date.now(),
                title: this.title,
                description: this.description,
                deadline: this.deadline,
                createdAt: new Date().toLocaleString(),
                lastEditedAt: new Date().toLocaleString(),
                isOverdue: false,
                isCompletedInTime: false,
                columnIndex: 0
            };

            // Очищаем форму
            this.title = '';
            this.description = '';
            this.deadline = '';

            // Эмитируем событие создания новой карточки
            this.$emit('create-card', newCard);
        }
    },
    template: `
    <div class="card-form">
      <h2>Создать карточку</h2>
      <input v-model="title" placeholder="Заголовок" required />
      <textarea v-model="description" placeholder="Описание" required></textarea>
      <input type="date" v-model="deadline" required />
      <button @click="submitForm">Создать</button>
    </div>
  `
});
// Компонент столбца
Vue.component('card-column', {
    props: ['cards', 'columnIndex', 'columnTitle'],
    template: `
    <div class="column">
      <h2>{{ columnTitle }}</h2>
      <card 
        v-for="card in cards" 
        :key="card.id" 
        :card="card" 
        @edit-card="editCard"
        @delete-card="deleteCard"
        @move-card="moveCard">
      </card>
      <div v-if="cards.length === 0">Нет задач</div>
    </div>
  `,
    methods: {
        editCard(card) {
            this.$emit('edit-card', card);
        },
        deleteCard(card) {
            this.$emit('delete-card', card);
        },
        moveCard(card, toIndex, meta = {}) {
            this.$emit('move-card', card, toIndex, meta);
        }
    }
});

new Vue({
    el: '#app',
    data: {
        columns: [
            { id: 1, title: 'Запланированные задачи', cards: [], maxCards: 3 },
            { id: 2, title: 'Задачи в работе', cards: [], maxCards: 5 },
            { id: 3, title: 'Тестирование', cards: [] },
            { id: 4, title: 'Выполненные задачи', cards: [] }
        ]
    },
    methods: {
        createCard(card) {
            if (this.columns[0].cards.length < this.columns[0].maxCards) {
                this.columns[0].cards.push(card);
            } else {
                alert('Первый столбец заполнен! Освободите место.');
            }
        },
        moveCard(card, toIndex, meta = {}) {
            const fromColumn = this.columns.find(col => col.cards.some(c => c.id === card.id));
            if (fromColumn) {
                const cardToMove = fromColumn.cards.find(c => c.id === card.id);
                if (cardToMove) {
                    fromColumn.cards = fromColumn.cards.filter(c => c.id !== cardToMove.id);

                    // Создаем копию карточки с обновленным индексом столбца
                    const updatedCard = { ...cardToMove, columnIndex: toIndex };

                    // Добавляем карточку в целевой столбец
                    this.columns[toIndex].cards.push(updatedCard);

                    // Если карточка перемещается в последний столбец, проверяем дэдлайн
                    if (toIndex === 3) {
                        this.checkDeadline(updatedCard); // Вызываем проверку дэдлайна
                    }

                    // Выводим причину возврата, если она указана
                    if (meta.reason) {
                        alert(`Карточка возвращена во второй столбец. Причина: ${meta.reason}`);
                    }
                }
            }
        },
        deleteCard(card) {
            const column = this.columns.find(col => col.cards.some(c => c.id === card.id));
            if (column) {
                column.cards = column.cards.filter(c => c.id !== card.id);
            }
        },
        editCard(card) {
            const updatedTitle = prompt('Введите новый заголовок', card.title);
            const updatedDescription = prompt('Введите новое описание', card.description);
            const updatedDeadline = prompt('Введите новый дэдлайн (YYYY-MM-DD)', card.deadline);
            if (updatedTitle && updatedDescription && updatedDeadline) {
                card.title = updatedTitle;
                card.description = updatedDescription;
                card.deadline = updatedDeadline;
                card.lastEditedAt = new Date().toLocaleString();

                // Если карточка находится в четвертом столбце, повторно проверяем дэдлайн
                if (card.columnIndex === 3) {
                    this.checkDeadline(card);
                }
            }
        },
        checkDeadline(card) {
            const deadline = new Date(card.deadline);
            const now = new Date();
            if (now > deadline) {
                // Используем Vue.set для обновления свойств
                this.$set(card, 'isOverdue', true);
                this.$set(card, 'isCompletedInTime', false);
            } else {
                this.$set(card, 'isOverdue', false);
                this.$set(card, 'isCompletedInTime', true);
            }
        }
    }
});