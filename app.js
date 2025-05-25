class DreamJournal {
    constructor() {
        this.dreams = this.loadDreams();
        this.initializeEventListeners();
        this.setDefaultDate();
        this.renderDreams();
    }

    loadDreams() {
        const stored = localStorage.getItem('dreamJournal');
        return stored ? JSON.parse(stored) : [];
    }

    saveDreams() {
        localStorage.setItem('dreamJournal', JSON.stringify(this.dreams));
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('dreamDate').value = today;
    }

    initializeEventListeners() {
        const form = document.getElementById('dreamForm');
        form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    handleSubmit(e) {
        e.preventDefault();

        const dreamData = {
            id: Date.now().toString(),
            date: document.getElementById('dreamDate').value,
            title: document.getElementById('dreamTitle').value,
            content: document.getElementById('dreamContent').value,
            mood: document.getElementById('dreamMood').value,
            createdAt: new Date().toISOString()
        };

        this.addDream(dreamData);
        this.clearForm();
        this.renderDreams();
    }

    addDream(dream) {
        this.dreams.unshift(dream);
        this.saveDreams();
    }

    clearForm() {
        document.getElementById('dreamTitle').value = '';
        document.getElementById('dreamContent').value = '';
        document.getElementById('dreamMood').value = '';
        this.setDefaultDate();
    }

    renderDreams() {
        const container = document.getElementById('dreamsList');

        if (this.dreams.length === 0) {
            container.innerHTML = '<p class="no-dreams">No dreams recorded yet. Start by recording your first dream!</p>';
            return;
        }

        const dreamsHTML = this.dreams.map(dream => `
            <div class="dream-item" data-id="${dream.id}">
                <h3>${dream.title}</h3>
                <div class="dream-meta">
                    ${this.formatDate(dream.date)} ${dream.mood ? `• ${dream.mood}` : ''}
                </div>
                <div class="dream-content">${dream.content}</div>
                <button class="delete-btn" onclick="dreamJournal.deleteDream('${dream.id}')">Delete</button>
            </div>
        `).join('');

        container.innerHTML = dreamsHTML;
    }

    deleteDream(dreamId) {
        if (confirm('Are you sure you want to delete this dream?')) {
            this.dreams = this.dreams.filter(dream => dream.id !== dreamId);
            this.saveDreams();
            this.renderDreams();
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}

// Initialize the application
const dreamJournal = new DreamJournal();