import express from "express";
import bodyParser from "body-parser";
import path from "path";
import fs from "fs";

const app = express();
const port = 3000;
app.use(express.static("public"));

app.get("/", (req, res) => {
    fs.readFile("public/posts/data.json", (err, data) => {
        if (err) {
            return res.status(500).send("Error reading data from JSON file");
        }

        const posts = JSON.parse(data);

        // for each post read the txt file that contains the blog text from the textPath property
        const postsWithContent = posts.map((post) => {
            try {
                const fullTextPath = post.textPath;
                // console.log("Trying to read file from: ", fullTextPath);
                const textContent = fs.readFileSync(post.textPath, 'utf-8');
                return { ...post, content: textContent };
            } catch (error) {
                return { ...post, content: "Error trying to load the content"};
            }
        });

        res.render("index.ejs", { posts: postsWithContent })
    });

});

app.listen(port , () => {
    console.log(`Listening on port ${port}`);
});
