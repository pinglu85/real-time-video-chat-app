const users = [];

// Add user to users
function userJoin(id, username) {
  const user = { id, username };
  users.push(user);
  return user;
}

// Get joined users
function getJoinedUsers(id) {
  return users.filter((user) => user.id !== id);
}

// Get current user
function getCurrentUser(id) {
  return users.find((user) => user.id === id);
}

// User leaves
function userLeave(id) {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

module.exports = {
  userJoin,
  getJoinedUsers,
  getCurrentUser,
  userLeave,
};
