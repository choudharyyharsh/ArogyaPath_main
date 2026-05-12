const db = require('./database');

db.serialize(() => {
    db.all("PRAGMA table_info(profiles)", (err, rows) => {
        if (err) {
            console.error("Error checking profiles table:", err.message);
        } else {
            console.log("Profiles Table Info:", rows);
        }
    });

    db.all("PRAGMA table_info(vitals)", (err, rows) => {
        if (err) {
            console.error("Error checking vitals table:", err.message);
        } else {
            console.log("Vitals Table Info:", rows);
        }
    });
});
