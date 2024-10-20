import express from "express";
import bodyParser from "body-parser";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from 'uuid';

const app = express();
const port = 3000;
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to parse JSON data (if needed)
// app.use(bodyParser.json());

function getCurrentDay() {
    const d = new Date();
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const date = String(day+"/"+month+"/"+year);
    return date
}

app.get("/", (req, res) => {
    fs.readFile("public/posts/data.json", (err, data) => {
        if (err) {
            return res.status(500).send("Error reading data from JSON file");
        }

        const posts = JSON.parse(data);

        // for each post read the txt file that contains the blog text from the textPath property
        const postsWithContent = posts.map((post) => {
            try {
                const textContentb = fs.readFileSync(post.textPath, 'utf-8');
                return { ...post, content: textContent };
            } catch (error) {
                return { ...post, content: "Error trying to load the content"};
            }
        });

        res.render("index.ejs", { posts: postsWithContent })
    });
});

app.get("/posts/:id", (req, res) => {
    const postId = req.params.id
    console.log(postId);
    fs.readFile("public/posts/data.json", (err, data) => {
        if (err) {
            return res.status(500).send("Error reading data from JSON file");
        }

        const posts = JSON.parse(data);
        const post = posts.find(post => post.id === postId);

        // for each post read the txt file that contains the blog text from the textPath property
        if (post) {
            try {
                const content = fs.readFileSync(post.textPath, 'utf8');
                post.content = content;
            } catch (error) {
                post.content = "Error loading content.";
            }
        }
        res.render("post.ejs", { post })
    });
});

app.get("/post/create", (req, res) => {
    res.render("post-create.ejs");
});

app.post("/post/create", (req, res) => {
    console.log(req.body); // Check what data is being received

    if (!req.body.author) {
        return res.status(400).send("Title is missing");
    }

    fs.readFile("public/posts/data.json", 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).send("Error reading data from JSON file");
        }

        const posts = JSON.parse(data);

        const date = getCurrentDay();
        // new Date().getDate() %>/<%= new Date().getMonth() + 1 %>/<%= new Date().getFullYear() %>
        const newPost = {
            id: uuidv4(),
            title: req.body.title,
            author: req.body.author,
            image: {
                src: `images/${req.body.image}`, // `{}.jpg`
                alt: req.body.image,
            },
            textPath: `public/posts/${req.body.title.replace(/\s+/g, '-').toLowerCase()}.txt`,
            datePublished: date
        };
        console.log("created new post");
        console.log(newPost);
        fs.writeFile(newPost.textPath, req.body["content"], (err) => {
            if (err) {
                return res.status(500).send("Error uploading the post content");
            }
        });

        // posts = {...posts, newPost};
        posts.push(newPost);

        fs.writeFile("public/posts/data.json", JSON.stringify(posts, null, 2), (err) => {
            if (err) {
                return res.status(500).send("Error writing new data in the JSON file.");
            }
            res.redirect("/");
        });
    });
});


app.listen(port , () => {
    console.log(`Listening on port ${port}`);
});
