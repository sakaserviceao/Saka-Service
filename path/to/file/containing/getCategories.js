function getCategories() {
    return db.query('SELECT id, name FROM categories'); // Updated query to remove join
}

// Ensure to map category data correctly based on new structure.
// Further mapping logic can be added if required.