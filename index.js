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
app.use(express.urlencoded({extended: true}));

app.get("/", async(req, res) =>{
    const result = await db.query("SELECT country_code FROM visited_countries");
    let countries = [];
    result.rows.forEach((country) =>{
        countries.push(country.country_code);
    });
    console.log(countries);
    console.log(result.rows);
    res.render("index.ejs", {countries: countries, total: countries.length});
    db.end();
})

app.listen(port, () =>{
    console.log(`server running at http://localhost:${port}`);
});