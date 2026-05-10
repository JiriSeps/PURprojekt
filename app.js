// app.js
import { DB } from './database.js';
import { LoginComponent, RegisterComponent, DashboardComponent } from './views.js';
import './datepicker.js'; // Tímto se načte a zaregistruje Webová komponenta

class TaskApp {
    constructor() {
        this.root = document.getElementById('app-root');
        this.currentUser = sessionStorage.getItem('active_user');
        this.view = 'login';
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
            sessionStorage.setItem('active_user', username);
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

// Spuštění aplikace po načtení stránky
window.onload = () => new TaskApp();