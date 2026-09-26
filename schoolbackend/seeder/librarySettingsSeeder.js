const mongoose = require('mongoose');
const Settings = require('../models/Admin/Settings');
const AcademicYear = require('../models/Admin/AcademicYear');

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school');
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Seed library settings
const seedLibrarySettings = async () => {
    try {
        // Get the latest academic year
        const academicYear = await AcademicYear.findOne().sort({ createdAt: -1 });
        
        if (!academicYear) {
            console.error('No academic year found. Please create an academic year first.');
            return;
        }

        // Check if settings already exist
        const existingSettings = await Settings.findOne();
        
        if (existingSettings) {
            // Update existing settings with library settings
            existingSettings.librarySettings = {
                maxBooksForStudent: 3,
                maxBooksForTeacher: 5,
                bookIssueDuration: 14,
                maxRenewals: 2,
                finePerDay: 1,
                gracePeriod: 3
            };
            
            await existingSettings.save();
            console.log('✅ Library settings updated successfully');
        } else {
            // Create new settings with library settings
            const newSettings = new Settings({
                academicYear: academicYear._id,
                term: 'Current Term',
                librarySettings: {
                    maxBooksForStudent: 3,
                    maxBooksForTeacher: 5,
                    bookIssueDuration: 14,
                    maxRenewals: 2,
                    finePerDay: 1,
                    gracePeriod: 3
                }
            });
            
            await newSettings.save();
            console.log('✅ Library settings created successfully');
        }

        console.log('Library Settings Configuration:');
        console.log('- Max Books for Student: 3');
        console.log('- Max Books for Teacher: 5');
        console.log('- Book Issue Duration: 14 days');
        console.log('- Max Renewals: 2');
        console.log('- Fine per Day: $1');
        console.log('- Grace Period: 3 days');

    } catch (error) {
        console.error('Error seeding library settings:', error);
    }
};

// Run the seeder
const runSeeder = async () => {
    await connectDB();
    await seedLibrarySettings();
    mongoose.connection.close();
    console.log('Seeder completed');
};

// Run if this file is executed directly
if (require.main === module) {
    runSeeder();
}

module.exports = { seedLibrarySettings };
