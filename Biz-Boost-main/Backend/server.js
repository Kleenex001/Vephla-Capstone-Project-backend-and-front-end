    const app = require('./app'); 
    const mongoose = require('mongoose');
    const PORT = process.env.PORT || 5000; // Define port

    
    // Connect to DB and start server
    mongoose.connect(process.env.MONGO_URI)
      .then(() => {
        console.log('✅MongoDB Connected successfully!');
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
      })
      .catch(err => {
        console.error('❌MongoDB connection error:', err);
        process.exit(1); 
      });