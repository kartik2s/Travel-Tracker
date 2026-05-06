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

async function checkVisited() {
    const result = await db.query("SELECT country_code FROM visited_countries");
    let countries = [];
    result.rows.forEach((country) => {
        countries.push(country.country_code);
    });
    console.log(result.rows);
    return countries;
}

app.get("/", async (req, res) => {
    const countries = await checkVisited();
    console.log(countries);
    res.render("index.ejs", {
        countries: countries, total: countries.length
    });
});

app.post("/add", async (req, res) => {
    try {
        const country = req.body.country;
        const result = await db.query("SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%'", [country.toLowerCase()]);

        const data = result.rows[0];
        console.log(data);
        const countryCode = data.country_code;
        try {
            await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)", [countryCode]);
            res.redirect("/");
        } catch (error) {
            console.log(error);
            const countries = await checkVisited();
            res.render("index.ejs", {
                countries: countries,
                total: countries.length,
                error: "Country has already been added, try again"
            });
        }
    } catch (error) {
        console.log(error);
        const countries = await checkVisited();
        res.render("index.ejs", {
            countries: countries,
            total: countries.length,
            error: "Country name does not exit, try again"
        });
    }
});

app.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
});