import express from "express";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "World1",
    password: "123456",
    port: 5432
});
db.connect();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

let currentUserId = 1;
let users = [
    { id: 1, name: "Angela", color: "teal" }
];

async function checkVisited() {
    const result = await db.query("SELECT country_code FROM visited_countries JOIN users ON users.id = user_id WHERE user_id = $1;", [currentUserId]);
    let countries = [];
    result.rows.forEach((country) => {
        countries.push(country.country_code);
    });
    console.log(result.rows);
    return countries;
}

async function getCurrentUser() {
    const result = await db.query("SELECT * FROM users");
    users = result.rows;
    return users.find((user) => user.id == currentUserId);
}

app.get("/", async (req, res) => {
    const countries = await checkVisited();
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return res.render("index.ejs", {
            countries: [],
            total: 0,
            users: [],
            color: "teal"
        });
    }
    console.log(countries);
    res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        users: users,
        color: currentUser.color
    });
});

app.post("/add", async (req, res) => {
    const currentUser = await getCurrentUser();
    try {
        const country = req.body.country;
        const result = await db.query("SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%'", [country.toLowerCase()]);

        const data = result.rows[0];
        console.log(data);
        const countryCode = data.country_code;
        try {
            await db.query("INSERT INTO visited_countries (country_code, user_id) VALUES ($1,$2)", [countryCode, currentUserId]);
            res.redirect("/");
        } catch (error) {
            console.log(error);
            const countries = await checkVisited();
            res.render("index.ejs", {
                countries: countries,
                total: countries.length,
                users: users,
                color: currentUser.color,
                error: "Country has already been added, try again"
            });
        }
    } catch (error) {
        console.log(error);
        const countries = await checkVisited();
        res.render("index.ejs", {
            countries: countries,
            total: countries.length,
            users: users,
            color: currentUser.color,
            error: "Country name does not exit, try again"
        });
    }
});

app.post("/user", async (req, res) => {
    currentUserId = req.body.user;
    res.redirect("/");
});

app.get("/new-user", (req, res) => {
    res.render("new.ejs");
});

app.post("/new", async (req, res) => {
    const name = req.body.name;
    const color = req.body.color;

    const result = await db.query("INSERT INTO users (name, color) VALUES ($1, $2) RETURNING *;",
        [name, color]
    );
    const id = result.rows[0].id;
    currentUserId = id;

    res.redirect("/");
});

app.post("/delete-user", async (req, res) => {
    const id = req.body.id;
    await db.query(
        "DELETE FROM visited_countries WHERE user_id = $1",
        [id]
    );
    await db.query(
        "DELETE FROM users WHERE id = $1",
        [id]
    );
    const result = await db.query("SELECT * FROM users");
    if (result.rows.length > 0) {
        currentUserId = result.rows[0].id;
    }
    if (result.rows.length === 1) {
        return res.send("At least one user required");
    }
    res.redirect("/");
});

app.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
});