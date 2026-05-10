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
    
    // Nové UI s plátnem pro papírky
    div.innerHTML = `
        <div class="main-ui">
            <div style="display:flex; justify-content:space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0;">Ahoj, ${username}! 🌪️</h3>
                <button class="btn-link" style="width:auto; margin: 0; padding: 0;" id="logout">Odhlásit</button>
            </div>
            <p style="font-size: 0.8em; color: #888; margin-bottom: 15px;">
                Napiš úkol a zmáčkni Enter. Splněný úkol drapni myší a hoď do skartovačky!
            </p>
            <div style="display: flex; gap: 10px;">
                <input type="text" id="new-task" placeholder="Co je třeba udělat?" style="margin: 0;">
                <button class="btn-primary" id="add-t" style="width: auto; margin: 0;">Vystřelit úkol</button>
            </div>
        </div>

        <div id="shredder" class="shredder">
            <span style="font-size: 2em; margin-bottom: 5px;">🗑️</span>
            Skartace
        </div>
        <div id="task-canvas" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 1;"></div>
    `;

    const canvas = div.querySelector('#task-canvas');
    const shredder = div.querySelector('#shredder');
    const input = div.querySelector('#new-task');

    // Super barvičky pro sticky notes
    const colors = ['#ffeb3b', '#ffc107', '#8bc34a', '#03a9f4', '#ff5722', '#e91e63'];

    // Vykreslení všech neskartovaných úkolů na jejich uložených pozicích
    tasks.forEach((t) => {
        if (t.done) return; // Neskartované úkoly žijí na plátně

        const note = document.createElement('div');
        note.className = 'sticky-note';
        
        // Zajištění zpětné kompatibility pro staré úkoly (vygenerujeme jim data)
        t.color = t.color || colors[Math.floor(Math.random() * colors.length)];
        t.x = t.x !== undefined ? t.x : Math.random() * (window.innerWidth - 200) + 50;
        t.y = t.y !== undefined ? t.y : Math.random() * (window.innerHeight - 200) + 50;
        t.rot = t.rot !== undefined ? t.rot : (Math.random() - 0.5) * 40;

        note.style.backgroundColor = t.color;
        note.style.left = `${t.x}px`;
        note.style.top = `${t.y}px`;
        note.style.transform = `rotate(${t.rot}deg)`;
        note.innerHTML = `<span>${t.text}</span>`;

        // 🎯 DRAG & DROP LOGIKA
        note.onmousedown = (e) => {
            let startX = e.clientX;
            let startY = e.clientY;
            let initialX = parseFloat(note.style.left) || 0;
            let initialY = parseFloat(note.style.top) || 0;

            const onMouseMove = (moveEvent) => {
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;
                note.style.left = `${initialX + dx}px`;
                note.style.top = `${initialY + dy}px`;

                // Detekce kolize se skartovačkou
                const shRect = shredder.getBoundingClientRect();
                const noteRect = note.getBoundingClientRect();
                
                // Pokud je papírek "nad" skartovačkou, skartovačka zčervená a začne se třást
                if (
                    noteRect.right > shRect.left + 20 && 
                    noteRect.left < shRect.right - 20 && 
                    noteRect.bottom > shRect.top + 20 && 
                    noteRect.top < shRect.bottom - 20
                ) {
                    shredder.classList.add('danger');
                } else {
                    shredder.classList.remove('danger');
                }
            };

            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                
                // Aktualizace pozice úkolu
                t.x = parseFloat(note.style.left);
                t.y = parseFloat(note.style.top);

                // SKARTACE!
                if (shredder.classList.contains('danger')) {
                    shredder.classList.remove('danger');
                    t.done = true; // Označíme jako hotový (skartovaný)
                    DB.saveTasks(username, tasks);
                    app.render(); // Zmizí z obrazovky
                } else {
                    // Jen se uložila nová pozice, pokud jsme ho neskartovali
                    DB.saveTasks(username, tasks);
                }
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        canvas.appendChild(note);
    });

    // Přidání nového úkolu (vygeneruje mu to náhodné hodnoty pro spawn)
    const addTask = () => {
        if (input.value.trim() !== "") {
            tasks.push({ 
                text: input.value, 
                done: false,
                // Spawnne se náhodně blízko středu obrazovky
                x: (window.innerWidth / 2) - 75 + (Math.random() - 0.5) * 200,
                y: (window.innerHeight / 2) - 75 + (Math.random() - 0.5) * 200,
                rot: (Math.random() - 0.5) * 50, // Náhodné naklonění
                color: colors[Math.floor(Math.random() * colors.length)]
            });
            DB.saveTasks(username, tasks);
            app.render();
        }
    };
    
    div.querySelector('#add-t').onclick = addTask;
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });
    div.querySelector('#logout').onclick = () => app.handleLogout();

    return div;
}
// Spuštění aplikace po načtení stránky
window.onload = () => new TaskApp();