FROM node:18-alpine

WORKDIR /app

# Setup a tiny inline vulnerable Express application
RUN npm init -y && npm install express sqlite3

COPY <<EOF /app/index.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run("CREATE TABLE users (id INT, username TEXT, password TEXT, flag TEXT)");
    db.run("INSERT INTO users VALUES (1, 'admin', 'super_secret_unhackable_pass_998', 'FLAG{sqli_bypass_successful_1337}')");
});

app.get('/', (req, res) => {
    res.send('<h1>Web Security Lab Playground</h1><p>Send a POST request to <code>/login</code> with JSON parameters <code>username</code> and <code>password</code> to try bypassing authentication.</p>');
});

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    
    // VULNERABLE SQL QUERY (CONCATENATION)
    const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
    
    db.all(query, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (rows && rows.length > 0) {
            res.json({ message: "Access Granted!", flag: rows[0].flag });
        } else {
            res.status(401).json({ error: "Access Denied: Invalid credentials." });
        }
    });
});

app.listen(8080, () => console.log('Vulnerable SQLi app listening on port 8080'));
EOF

EXPOSE 8080
CMD ["node", "index.js"]
