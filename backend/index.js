import express from "express";
import bodyParser from "body-parser";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from 'uuid';
import multer from "multer";

const app = express();
const port = 3000;
// const upload = multer(
//     { 
//         dest: 'public/uploads/',
//         filename: function (req, file, cb) {
//             // Sanitize the original filename by replacing spaces and non-alphanumeric characters with dashes
//             const originalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '-');
//             cb(null, originalName);
//         }
//     }
// );

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images/'); // Directory where files will be saved
    },
    filename: function (req, file, cb) {
        // Sanitize the original filename by replacing spaces and non-alphanumeric characters with dashes
        const originalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '-');
        cb(null, originalName);
    }
});
const upload = multer({ storage: storage });

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
    fs.readFile("public/posts/data.json", (err, data) => {
        if (err) {
            return res.status(500).send("Error reading data from JSON file");
        }

        const posts = JSON.parse(data);
        const post = posts.find(post => post.id === postId);

        if (post) {
            try {
                const content = fs.readFileSync(post.textPath, 'utf8');
                post.content = content;
            } catch (error) {
                post.content = "Error loading content.";
            }
        }
        // console.log(post);
        res.render("post.ejs", { post })
    });
});

app.get("/posts/update/:id", (req, res) => {
    const postToUpdateId = req.params.id;
    fs.readFile("public/posts/data.json", 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).send("Error reading data from JSON file");
        }
        const posts = JSON.parse(data);
        const postToUpdate = posts.find(post => post.id === postToUpdateId);
        if (postToUpdate) {
            try {
                const content = fs.readFileSync(postToUpdate.textPath, 'utf8');
                postToUpdate.content = content;
            } catch (error) {
                postToUpdate.content = "Error loading content.";
            }
        }
        // console.log(postToUpdate);
        res.render("post-update.ejs", {post: postToUpdate});
    });
});

app.put("/post/update/:id", upload.single('image'), (req, res) => {
    const updatedPostId = req.params.id;
    const date = getCurrentDay();
    // const updatedPost = {
    //     id: updatedPostId,
    //     title: req.body.titleToUpdate,
    //     author: req.body.authorToUpdate,
    //     image: {
    //         src: req.file ? `images/${req.file.originalname}` : '',
    //         alt: req.body.titleToUpdate,
    //     },
    //     textPath: `public/posts/${req.body.titleToUpdate.replace(/[^a-zA-Z]+/g, '-').toLowerCase()}.txt`,
    //     datePublished: date,
    //     content: req.body.contentToUpdate
    // }
    fs.readFile("public/posts/data.json", 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).send("Error reading data from JSON file");
        }
        const posts = JSON.parse(data);
        // const newPosts = posts.filter(post => post.id !== updatedPostId);
        // const updatedPosts = [...posts, updatedPost];
        const postIndex = posts.findIndex(post => post.id === updatedPostId);
        if (postIndex === -1) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        try {
            const content = fs.readFileSync(posts[postIndex].textPath, 'utf8');
            posts[postIndex].content = content;
        } catch (error) {
            posts[postIndex].content = "Error loading content.";
        }
        console.log(posts[postIndex].content);

        if (req.body.title && req.body.title !== posts[postIndex].title) {
            posts[postIndex].title = req.body.title;
        }
        if (req.body.author && req.body.author !== posts[postIndex].author) {
            posts[postIndex].author = req.body.author;
        }
        if (req.body.content && req.body.content !== posts[postIndex].content) {
            posts[postIndex].content = req.body.content;
        }
        if (req.file) {
            posts[postIndex].image.src = `images/${req.file.originalname}`;
        }

        fs.writeFile(posts[postIndex].textPath, req.body.content, (err) => {
            if (err) {
                return res.status(500).send("Error uploading the post content");
            }
        });

        fs.writeFile("public/posts/data.json", JSON.stringify(posts, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error writing data to database' });
            }
            return res.status(200).json({ success: true });
        });
    });
});

app.get("/post/create", (req, res) => {
    res.render("post-create.ejs");
});

app.post("/post/create", upload.single('image'), (req, res) => {
    // console.log("body: ",req.body); // Check what data is being received
    // console.log("file: ",req.file);

    fs.readFile("public/posts/data.json", 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).send("Error reading data from JSON file");
        }

        const posts = JSON.parse(data);

        if (posts.length >= 9) {
            return res.status(500).send("Total posts can't exceed number 10");
        }

        const date = getCurrentDay();
        // new Date().getDate() %>/<%= new Date().getMonth() + 1 %>/<%= new Date().getFullYear() %>
        const newPost = {
            id: uuidv4(),
            title: req.body.title,
            author: req.body.author,
            image: {
                src: req.file ? `images/${req.file.originalname}` : '', // `{}.jpg`
                alt: req.body.title,
            },
            textPath: `public/posts/${req.body.title.replace(/[^a-zA-Z]+/g, '-').toLowerCase()}.txt`,
            datePublished: date
        };

        // console.log("created new post");
        // console.log(newPost);
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

app.delete("/posts/delete/:id", (req, res) => {
    const postId = req.params.id;
    fs.readFile("public/posts/data.json", 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).send("Error reading data from JSON file");
        }
        
        const posts = JSON.parse(data);
        const postToDelete = posts.find(post => post.id === postId);
        const textFilePath = postToDelete.textPath;
        // console.log("path to delete: ", textFilePath);
        const imageFilePath = postToDelete.image.src;
        // console.log("image to delete: ", imageFilePath);

        fs.unlink(textFilePath, (err) => {
            if (err) {
                return res.status(500).send("Error deleting the content file");
            }
        });

        fs.unlink(`public/${imageFilePath}`, (err) => {
            if (err) {
                return res.status(500).send("Error deleting the image file");
            }
        });

        const updatedPosts = posts.filter(post => post.id !== postId);

        fs.writeFile("public/posts/data.json", JSON.stringify(updatedPosts, null, 2), (err) => {
            if (err) {
                return res.status(500).send("Error deleting post from JSON file.");
            }
        });
        return res.status(200).send("Post deleted successfully!");
    });
});


app.listen(port , () => {
    console.log(`Listening on port ${port}`);
});
