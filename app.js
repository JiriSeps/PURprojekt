/**
 * VRSTVA 1: DATA SERVICE (Práce s LocalStorage - simulace databáze)
 */
const DB = {
    // Správa uživatelů
    getUsers: () => JSON.parse(localStorage.getItem('sys_users') || '[]'),
    saveUser: (user) => {
        const users = DB.getUsers();
        users.push(user);
        localStorage.setItem('sys_users', JSON.stringify(users));
    },
    // Správa úkolů vázaných na konkrétní jméno
    getTasks: (username) => JSON.parse(localStorage.getItem(`tasks_${username}`) || '[]'),
    saveTasks: (username, tasks) => localStorage.setItem(`tasks_${username}`, JSON.stringify(tasks))
};

/**
 * VRSTVA 2: HLAVNÍ LOGIKA APLIKACE (State Management)
 */
class TaskApp {
    constructor() {
        this.root = document.getElementById('app-root');
        this.currentUser = sessionStorage.getItem('active_user'); // Simulace "session"
        this.view = 'login'; // Možné stavy: login | register | dashboard
        this.render();
    }

    handleRegister(username, password) {
        if (!username || !password) return "Vyplňte jméno i heslo!";
        
        const users = DB.getUsers();
        if (users.find(u => u.username === username)) return "Uživatel již existuje!";
        
        DB.saveUser({ username, password });
        this.view = 'login';
        this.render("Registrace byla úspěšná, nyní se můžete přihlásit.");
    }

    handleLogin(username, password) {
        const users = DB.getUsers();
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            this.currentUser = username;
            sessionStorage.setItem('active_user', username); // Uložení přihlášení
            this.view = 'dashboard';
            this.render();
        } else {
            return "Nesprávné jméno nebo heslo!";
        }
    }

    handleLogout() {
        this.currentUser = null;
        sessionStorage.removeItem('active_user');
        this.view = 'login';
        this.render();
    }

    // Centrální vykreslovací metoda
    render(msg = "") {
        this.root.innerHTML = "";
        
        if (this.currentUser) {
            this.root.appendChild(DashboardComponent(this));
        } else if (this.view === 'register') {
            this.root.appendChild(RegisterComponent(this, msg));
        } else {
            this.root.appendChild(LoginComponent(this, msg));
        }
    }
}

/**
 * VRSTVA 3: VIZUÁLNÍ KOMPONENTY
 */

function LoginComponent(app, msg) {
    const div = document.createElement('div');
    div.innerHTML = `
        <h2>Přihlášení</h2>
        ${msg ? `<p class="${msg.includes('úspěšná') ? '' : 'error'}" style="${msg.includes('úspěšná') ? 'color:green' : ''}">${msg}</p>` : ''}
        <input type="text" id="l-user" placeholder="Jméno">
        <input type="password" id="l-pass" placeholder="Heslo">
        <button class="btn-primary" id="btn-l">Vstoupit</button>
        <button class="btn-link" id="btn-to-reg">Nemáte účet? Zaregistrujte se</button>
    `;
    div.querySelector('#btn-l').onclick = () => {
        const err = app.handleLogin(div.querySelector('#l-user').value, div.querySelector('#l-pass').value);
        if (err) app.render(err);
    };
    div.querySelector('#btn-to-reg').onclick = () => { app.view = 'register'; app.render(); };
    return div;
}

function RegisterComponent(app, msg) {
    const div = document.createElement('div');
    div.innerHTML = `
        <h2>Nová registrace</h2>
        ${msg ? `<p class="error">${msg}</p>` : ''}
        <input type="text" id="r-user" placeholder="Zvolte jméno">
        <input type="password" id="r-pass" placeholder="Zvolte heslo">
        <button class="btn-primary" id="btn-r">Zaregistrovat se</button>
        <button class="btn-link" id="btn-to-log">Zpět na přihlášení</button>
    `;
    div.querySelector('#btn-r').onclick = () => {
        const err = app.handleRegister(div.querySelector('#r-user').value, div.querySelector('#r-pass').value);
        if (err) app.render(err);
    };
    div.querySelector('#btn-to-log').onclick = () => { app.view = 'login'; app.render(); };
    return div;
}

function DashboardComponent(app) {
    const username = app.currentUser;
    const tasks = DB.getTasks(username);
    const div = document.createElement('div');
    
    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0;">Ahoj, ${username}!</h3>
            <button class="btn-link" style="width:auto; margin: 0; padding: 0;" id="logout">Odhlásit</button>
        </div>
        
        <div style="display: flex; gap: 10px; margin-bottom: 30px;">
            <input type="text" id="new-task" placeholder="Co je třeba udělat?" style="margin: 0;">
            <button class="btn-primary" id="add-t" style="width: auto; margin: 0; white-space: nowrap;">Přidat</button>
        </div>

        <div id="active-tasks">
            <h4 style="color: #4a90e2; border-bottom: 1px solid #eee; padding-bottom: 5px;">Aktivní úkoly</h4>
            <div class="list"></div>
        </div>
        
        <div id="completed-tasks" style="margin-top: 30px;">
            <h4 style="color: #888; border-bottom: 1px solid #eee; padding-bottom: 5px;">Dokončené</h4>
            <div class="list"></div>
        </div>
    `;

    const activeCont = div.querySelector('#active-tasks .list');
    const completedCont = div.querySelector('#completed-tasks .list');

    // Rozdělení úkolů na aktivní a dokončené
    const activeTasks = tasks.filter(t => !t.done);
    const completedTasks = tasks.filter(t => t.done);

    // Pokud nejsou žádné úkoly, zobrazíme zprávu
    if (activeTasks.length === 0) activeCont.innerHTML = '<p style="color:#aaa; font-size:0.9em;">Žádné aktivní úkoly. Skvělá práce!</p>';
    if (completedTasks.length === 0) completedCont.innerHTML = '<p style="color:#aaa; font-size:0.9em;">Zatím nic dokončeno.</p>';

tasks.forEach((t) => {
        const item = document.createElement('div');
        item.className = 'task-item';
        
        // Upgraded HTML to include a Delete button
        item.innerHTML = `
            <span class="${t.done ? 'done' : ''}">${t.text}</span> 
            <div style="display:flex; gap: 5px;">
                <button class="toggle-btn" style="width:auto; padding:5px 10px; background:${t.done ? '#888' : '#28a745'}; color:white; margin:0;">
                    ${t.done ? 'Vrátit zpět' : 'Hotovo ✓'}
                </button>
                <button class="del-btn" style="width:auto; padding:5px 10px; background:#d0021b; color:white; margin:0;">✕</button>
            </div>
        `;

        // Toggle state
        item.querySelector('.toggle-btn').onclick = () => {
            const taskIndex = tasks.indexOf(t);
            tasks[taskIndex].done = !tasks[taskIndex].done;
            DB.saveTasks(username, tasks);
            app.render(); 
        };

        // NEW: Delete task
        item.querySelector('.del-btn').onclick = () => {
            const taskIndex = tasks.indexOf(t);
            tasks.splice(taskIndex, 1); // Remove the item from the array
            DB.saveTasks(username, tasks);
            app.render();
        };

        if (t.done) {
            completedCont.appendChild(item);
        } else {
            activeCont.appendChild(item);
        }
    });

    const addBtn = div.querySelector('#add-t');
    const input = div.querySelector('#new-task');

    // Logic for adding a task
    const addTask = () => {
        if (input.value.trim() !== "") {
            tasks.push({ text: input.value, done: false });
            DB.saveTasks(username, tasks);
            app.render();
        }
    };

    // Button click
    addBtn.onclick = addTask;
    
    // NEW: Pressing "Enter" to add task
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    // Přidání nového úkolu
    div.querySelector('#add-t').onclick = () => {
        const input = div.querySelector('#new-task');
        if (input.value.trim() !== "") {
            tasks.push({ text: input.value, done: false });
            DB.saveTasks(username, tasks);
            app.render();
        }
    };
    
    // Odhlášení
    div.querySelector('#logout').onclick = () => app.handleLogout();

    return div;
}

// Spuštění aplikace po načtení stránky
window.onload = () => new TaskApp();