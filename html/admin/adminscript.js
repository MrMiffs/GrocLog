const itemList = document.getElementById('item-list');

function addButtons(li, entry) {
    //Create Buttons
    const buttonDiv = document.createElement("div");
    buttonDiv.classList.add("button-container");
    // Edit Button
    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.onclick = () => editUser(entry);

    // Delete Button
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.onclick = () => deleteUser(entry);

    //Add Buttons to list item
    buttonDiv.appendChild(editButton);
    buttonDiv.appendChild(deleteButton);
    li.appendChild(buttonDiv);
}

// Function to load users from database
async function loadUsers() {
    const response = await fetch("/api/getusers", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
    });
    const results = await response.json();
    itemList.innerHTML = "";
    results.forEach(entry => {
        const li = document.createElement("li");
        li.textContent = `${entry.userId}: Username: ${entry.username} Role: ${entry.role}`;

        addButtons(li, entry);
        itemList.appendChild(li);
    });
}

// Function to handle adding a user
async function addUser(event) {
    event.preventDefault();

    const username = document.getElementById("usernameAdd").value;
    const password = document.getElementById("passwordAdd").value;
    const role = document.getElementById("roleAdd").value;

    await fetch("/api/adduser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role })
    });

    // Reload users after adding
    loadUsers();
}

// Function to handle deleting a user
async function deleteUser(entry) {
    await fetch('/api/deleteuser', {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({userId : entry.userId}),
    });
    loadUsers();
}

// Function to handle editing a user
async function editUser(entry) {
    const newUsername = prompt("Edit username:", entry.username);
    const newPassword = prompt("Edit password:");
    const newRole = prompt("Edit Role:", entry.role);

    await fetch("/api/edituser", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            userId: entry.userId,
            username: (newUsername !== null && newUsername !== "") ? newUsername : entry.username,
            password: (newPassword !== null && newPassword !== "") ? newPassword : entry.passwordHash,
            role: (newRole !== null && newRole !== "") ? newRole : entry.role,
        }),
    });

    loadUsers(); // Refresh the list after editing
}

// Function to handle searching for users
async function searchUsers(event) {
    event.preventDefault();

    const username = document.getElementById("usernameSearch").value;
    const role = document.getElementById("roleSearch").value;

    const response = await fetch("/api/searchusers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username, role: role })
    });

    const results = await response.json();
    itemList.innerHTML = "";

    results.forEach(entry => {
        const li = document.createElement("li");
        li.textContent = `${entry.userId}: Username: ${entry.username} Role: ${entry.role}`;

        addButtons(li, entry);
        itemList.appendChild(li);
    });
}

document.addEventListener("DOMContentLoaded", async function () {
    userRole = parseInt(sessionStorage.getItem("role"));
    console.log("role returned:", userRole);

    if (userRole === 1) {
        loadUsers();
    }
    else {
        console.error("Invalid user role, skipping item loading.");
        window.location.href = '/';
    }
});


document.getElementById("Add").addEventListener("submit", addUser);
document.getElementById("Search").addEventListener("submit", searchUsers);
document.getElementById("Search").addEventListener("reset", loadUsers);