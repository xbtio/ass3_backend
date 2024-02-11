async function addUser(username, password) {
    try {
        const response = await fetch('/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to add user');
        }
    } catch (error) {
        console.error('Error adding user:', error);
    }
}

async function updateUser(userId, username, password) {
    try {
        const response = await fetch(`/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to update user');
        }
    } catch (error) {
        console.error('Error updating user:', error);
    }
}

async function deleteUser(userId) {
    try {
        const response = await fetch(`/admin/users/${userId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to delete user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
    }
}

document.getElementById('addUserForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const username = document.getElementById('addUsername').value;
    const password = document.getElementById('addPassword').value;
    await addUser(username, password);
    window.location.reload();
});

document.querySelectorAll('.update-user-form').forEach(form => {
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        const userId = form.dataset.userId;
        const username = document.getElementById(`editUsername_${userId}`).value;
        const password = document.getElementById(`editPassword_${userId}`).value;
        await updateUser(userId, username, password);
        window.location.reload();
    });
});

document.querySelectorAll('.delete-user-button').forEach(button => {
    button.addEventListener('click', async function() {
        const userId = button.dataset.userId;
        if (confirm('Are you sure you want to delete this user?')) {
            await deleteUser(userId);
            window.location.reload();
        }
    });
});
