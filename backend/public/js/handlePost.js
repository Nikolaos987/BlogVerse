function remove(id) {
    fetch(`/posts/delete/${id}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (response.ok) {
            const deletedPost = document.getElementById(id);
            // deletedPost.remove();
            deletedPost.style.opacity = 0;
            setTimeout(() => deletedPost.remove(), 500);
            // alert('Post was deleted!');
        } else {
            alert('Deleting the post failed.');
        }
    })
    .catch(error => console.error('Error ', error));
}

function modify(id) {
    const postId = id;
    const title = document.getElementById('titleToUpdate').value;
    const author = document.getElementById('authorToUpdate').value;
    const content = document.getElementById('contentToUpdate').value;
    const imageFile = document.getElementById('imageToUpdate').files[0];

    const formData = new FormData();
    formData.append('title', title);
    formData.append('author', author);
    formData.append('content', content);
    if (imageFile) {
        formData.append('image', imageFile);
    }

    fetch(`/post/update/${id}`, {
        method: 'PUT',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if(data.success) {
            document.getElementById('titleToUpdate').innerText = title;
            document.getElementById('authorToUpdate').innerText = author;
            document.getElementById('contentToUpdate').innerText = content;
            document.getElementById('imageToUpdate').src = `/images/${imageFile ? imageFile.originalname : ''}` // originalName FIX POST.IMAGE.ID there is no post variable
            // window.location.href = "http://localhost:3000/";
        } else {
            console.log("Error updating the post");
        }
    })
    .catch(error => console.error('Error: ', error));
}

function getModify(id) {
    window.location.href = `/posts/update/${id}`;
}