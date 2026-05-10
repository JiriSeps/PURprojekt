// database.js
export const DB = {
    getUsers: () => JSON.parse(localStorage.getItem('sys_users') || '[]'),
    saveUser: (user) => {
        const users = DB.getUsers();
        users.push(user);
        localStorage.setItem('sys_users', JSON.stringify(users));
    },
    getTasks: (username) => JSON.parse(localStorage.getItem(`tasks_${username}`) || '[]'),
    saveTasks: (username, tasks) => localStorage.setItem(`tasks_${username}`, JSON.stringify(tasks))
};