function deletePost(id) {
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
    .catch(error => console.error('Error', error));
}