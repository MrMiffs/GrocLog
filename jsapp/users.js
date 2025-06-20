//Functions needed to access and manage users  table in MySQL database

const db = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET = 'desert-you';

console.log('Accessing users.js...');

// Get all users
async function getUsers(req, res) {
    try {
        const users = await db.User.find({});
        res.json(users);
    } catch (err) {
        console.error('Error retrieving users:', err);
        res.status(500).json({ error: 'Database error' });
    }
}


async function login(req, res) {
    const { username, password } = req.body;

    // Check for user with matching username
    const user = await db.User.findOne({ username });
    if (!user) {
        return res.status(401).json({ message: 'User not found' });
    }

    // Check if saved hashed password matched hash of incoming password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (isValid) {
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET || SECRET, // Fallback for development
            { expiresIn: '1h' }
        );

        // Save the token in an HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Secure in production
            maxAge: 3600000 // 1 hour in milliseconds
        });

        // Return json with user info (password is not saved)
        return res.status(200).json({
            message: 'Login successful',
            user: { id: user.userId, username: user.username, role: user.role }
        });
    } else {
        return res.status(401).json({ message: 'Invalid password' });
    }
}

async function register(req, res) {
    const { username, password } = req.body;

    //if user already exists
    const user = await db.User.findOne({ username });
    if (user) {return res.status(409).json({ message: 'User already exists' });}

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = new db.User({ username, passwordHash, User: 0 })

    try{
        await newUser.save();
        return res.status(200).json({
            message: 'Login successful',
            user: { id: newUser.userId, username: newUser.username, role: newUser.role }
        });
    } catch (err) {
        res.status(500).json({message: 'Error registering user'});
    }

}

async function addUser(req, res) {
    const { username, password, role } = req.body;

    if (await db.User.findOne({ username })) {
        return res.status(409).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = new db.User({ username, passwordHash, role });

    try {
        await newUser.save();
        res.status(200).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error registering user', error: err });
    }
}


async function searchUsers(req, res) {
    const { username, role } = req.body;
    let filter = {};

    if (username) {
        filter.username = { $regex: username, $options: 'i' };
    }
    if (role !== undefined) {
        filter.role = role;
    }

    try {
        const users = await db.User.find(filter);
        res.json(users);
    } catch (err) {
        console.error('Error searching users:', err);
        res.status(500).json({ error: 'Database error' });
    }
}

async function deleteUser(req, res) {
    const { userId } = req.body;

    try {
        const result = await db.User.deleteOne({ userId: userId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: 'Database error' });
    }
}

async function editUser(req, res) {
    const { userId, username, password, role } = req.body;
    if (!userId || !username || !password || !role) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const user = await db.User.findOne({ userId });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let updateFields = {
            username,
            role
        };

        // Check if the new password matches the current hashed password
        const isSamePassword = password === user.passwordHash;
        if (!isSamePassword) {
            // Only re-hash and update the password if it's different
            updateFields.passwordHash = await bcrypt.hash(password, 10);
        }

        const result = await db.User.updateOne(
            { userId },
            { $set: updateFields }
        );

        if (result.modifiedCount === 0) {
            return res.status(200).json({ message: 'No changes were made' });
        }

        res.json({ message: 'User updated successfully' });
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ error: 'Database error' });
    }
}

async function getID(req, res) {
    const { user, pw } = req.body;
    if (!user || !pw) {
        return res.status(400).json({ code: -1 });
    }

    const foundUser = await db.User.findOne({ username: user });
    if (!foundUser) {
        return res.status(400).json({ id: -1 });
    }

    const valid = await bcrypt.compare(pw, foundUser.passwordHash);
    if (!valid) {
        return res.status(400).json({ id: -1 });
    }

    if (foundUser.role === 1) {
        return res.status(400).json({ id: 0 });
    }

    return res.status(200).json({ id: foundUser.userId });
}

module.exports = {
    getUsers,
    login,
    addUser,
    searchUsers,
    deleteUser,
    editUser,
    getID,
    register,
}