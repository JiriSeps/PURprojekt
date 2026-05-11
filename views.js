// views.js
import { DB } from './database.js';

export function LoginComponent(app, msg) {
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

export function RegisterComponent(app, msg) {
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

export function DashboardComponent(app) {
    const username = app.currentUser;
    const tasks = DB.getTasks(username);
    const div = document.createElement('div');

    div.innerHTML = `
        <div style="position: relative; z-index: 10;">
            <div style="display:flex; justify-content:space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0;">Ahoj, ${username}!</h3>
                <button class="btn-link" style="width:auto; margin: 0; padding: 0;" id="logout">Odhlásit</button>
            </div>
            
            <div style="display: flex; gap: 10px; margin-bottom: 30px; align-items: flex-end;">
                <div style="flex: 1;">
                    <p style="font-size: 0.8em; color: #666; margin-bottom: 5px;">Název úkolu</p>
                    <input type="text" id="new-task" placeholder="Co je třeba udělat?" style="margin: 0;">
                </div>
                <div style="width: 160px;">
                    <p style="font-size: 0.8em; color: #666; margin-bottom: 5px;">Termín</p>
                    <custom-datepicker id="new-deadline"></custom-datepicker>
                </div>
                <button class="btn-primary" id="add-t" style="height: 47px; margin: 0;">Přidat</button>
            </div>

            <div id="drop-active" class="drop-zone" style="padding: 10px; min-height: 80px;">
                <h4 style="color: #4a90e2; border-bottom: 1px solid #eee; padding-bottom: 5px;">Aktivní úkoly (Přetáhni sem nápad!)</h4>
                <div class="list" id="active-tasks"></div>
            </div>
            
            <div id="completed-tasks" style="margin-top: 30px; padding: 10px;">
                <h4 style="color: #888; border-bottom: 1px solid #eee; padding-bottom: 5px;">Dokončené</h4>
                <div class="list"></div>
            </div>
        </div>
        
        <div id="ideas-canvas" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 1; overflow: hidden;"></div>
    `;

    const activeCont = div.querySelector('#active-tasks');
    const completedCont = div.querySelector('#completed-tasks .list');
    const input = div.querySelector('#new-task');
    const datePickerEl = div.querySelector('#new-deadline');

    const activeTasks = tasks.filter(t => !t.done);
    const completedTasks = tasks.filter(t => t.done);

    if (activeTasks.length === 0) activeCont.innerHTML = '<p style="color:#aaa; font-size:0.9em;">Žádné aktivní úkoly. Přetáhni nějaký z okolí!</p>';
    if (completedTasks.length === 0) completedCont.innerHTML = '<p style="color:#aaa; font-size:0.9em;">Zatím nic dokončeno.</p>';

    tasks.sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.localeCompare(b.deadline);
    });

    tasks.forEach((t) => {
        const item = document.createElement('div');
        item.className = 'task-item';

        let formattedDeadline = "";
        if (t.deadline) {
            const dateParts = t.deadline.split('-');
            formattedDeadline = `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`;
        }

        item.innerHTML = `
            <span class="${t.done ? 'done' : ''}">${t.text}</span> 
            ${formattedDeadline ? `<span class="deadline" style="font-size: 0.85em; color: #ef4444; margin-left: 10px;">📅 ${formattedDeadline}</span>` : ''}
            <div style="display:flex; gap: 5px; margin-left: 15px;">
                <button class="fav-btn" style="width:auto; padding:5px 10px; background:#eab308; color:white; margin:0;" title="Přidat do létajících nápadů">⭐</button>
                <button class="toggle-btn" style="width:auto; padding:5px 10px; background:${t.done ? '#888' : '#28a745'}; color:white; margin:0;">
                    ${t.done ? 'Vrátit' : 'Hotovo ✓'}
                </button>
                <button class="del-btn" style="width:auto; padding:5px 10px; background:#d0021b; color:white; margin:0;">✕</button>
            </div>
        `;

        // adding favourites
        item.querySelector('.fav-btn').onclick = () => {
            DB.addFavorite(t.text);
            alert(`Nápad "${t.text}" byl přidán mezi oblíbené a příště poletí kolem!`);
        };

        item.querySelector('.toggle-btn').onclick = () => {
            const taskIndex = tasks.indexOf(t);
            tasks[taskIndex].done = !tasks[taskIndex].done;
            DB.saveTasks(username, tasks);
            app.render();
        };

        item.querySelector('.del-btn').onclick = () => {
            const taskIndex = tasks.indexOf(t);
            tasks.splice(taskIndex, 1);
            DB.saveTasks(username, tasks);
            app.render();
        };
        if (t.done) completedCont.appendChild(item);
        else activeCont.appendChild(item);
    });

    const addTask = () => {
        if (input.value.trim() !== "") {
            tasks.push({ text: input.value, done: false, deadline: datePickerEl.getValue() });
            DB.saveTasks(username, tasks);
            app.render();
        }
    };
    div.querySelector('#add-t').onclick = addTask;
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });
    div.querySelector('#logout').onclick = () => app.handleLogout();

    const dropZone = div.querySelector('#drop-active');
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('dragover'); });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const draggedIdeaText = e.dataTransfer.getData('text/plain');
        if (draggedIdeaText) {
            tasks.push({ text: draggedIdeaText, done: false, deadline: "" });
            DB.saveTasks(username, tasks);
            app.render();
        }
    });

const canvas = div.querySelector('#ideas-canvas');
    fetch('ideas.json')
        .then(response => response.json())
        .then(jsonIdeas => {
            // json favourites join
            const userFavorites = DB.getFavorites();
            const allIdeas = [...jsonIdeas, ...userFavorites];

            for(let i = 0; i < 4; i++) {
                // allIdeas pole
                const ideaText = allIdeas[Math.floor(Math.random() * allIdeas.length)];
                const ideaEl = document.createElement('div');
                ideaEl.className = 'floating-idea';
                ideaEl.innerText = ideaText;
                ideaEl.draggable = true;
                ideaEl.style.pointerEvents = 'auto'; 
                
                const isLeft = Math.random() > 0.5;
                const xPos = isLeft ? (Math.random() * 15) + 5 : (Math.random() * 15) + 75; 
                const yPos = (Math.random() * 80) + 10; 
                
                ideaEl.style.left = `${xPos}vw`;
                ideaEl.style.top = `${yPos}vh`;
                ideaEl.style.animationDelay = `${Math.random() * 2}s`;

                ideaEl.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', ideaText);
                });
                canvas.appendChild(ideaEl);
            }
        })
        .catch(error => {
            // in case .json doesnt work (CORS)
            // user favourites atleast
            console.error("JSON se nenačetl, zkouším načíst alespoň oblíbené z prohlížeče.", error);
            const userFavorites = DB.getFavorites();
            if (userFavorites.length > 0) {
                 const ideaEl = document.createElement('div');
                 ideaEl.className = 'floating-idea';
                 ideaEl.innerText = userFavorites[Math.floor(Math.random() * userFavorites.length)];
                 ideaEl.style.left = `10vw`;
                 ideaEl.style.top = `50vh`;
                 canvas.appendChild(ideaEl);
            }
        })
        .catch(error => console.error("Jejda, nápady se nepodařilo načíst:", error));

    return div;
}