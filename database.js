// database.js
export const DB = {
    getUsers: () => JSON.parse(localStorage.getItem('sys_users') || '[]'),
    saveUser: (user) => {
        const users = DB.getUsers();
        users.push(user);
        localStorage.setItem('sys_users', JSON.stringify(users));
    },
    getTasks: (username) => JSON.parse(localStorage.getItem(`tasks_${username}`) || '[]'),
    saveTasks: (username, tasks) => localStorage.setItem(`tasks_${username}`, JSON.stringify(tasks)),
    
    // favourites + flying 
    getFavorites: () => JSON.parse(localStorage.getItem('sys_favorites') || '[]'),
    addFavorite: (ideaText) => {
        const favs = DB.getFavorites();
        // check for identicals
        if (!favs.includes(ideaText)) {
            favs.push(ideaText);
            localStorage.setItem('sys_favorites', JSON.stringify(favs));
        }
    }
};