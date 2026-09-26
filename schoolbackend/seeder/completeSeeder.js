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

// Create academic year if it doesn't exist
const createAcademicYear = async () => {
    try {
        const existingAcademicYear = await AcademicYear.findOne();
        
        if (!existingAcademicYear) {
            const currentYear = new Date().getFullYear();
            const academicYear = new AcademicYear({
                academicYear: `${currentYear}-${currentYear + 1}`,
                terms: ['Term 1', 'Term 2', 'Term 3']
            });
            
            await academicYear.save();
            console.log('✅ Academic year created successfully');
            return academicYear;
        } else {
            console.log('✅ Academic year already exists');
            return existingAcademicYear;
        }
    } catch (error) {
        console.error('Error creating academic year:', error);
        throw error;
    }
};

// Seed library settings
const seedLibrarySettings = async (academicYear) => {
    try {
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

        console.log('\n📚 Library Settings Configuration:');
        console.log('- Max Books for Student: 3');
        console.log('- Max Books for Teacher: 5');
        console.log('- Book Issue Duration: 14 days');
        console.log('- Max Renewals: 2');
        console.log('- Fine per Day: $1');
        console.log('- Grace Period: 3 days');

    } catch (error) {
        console.error('Error seeding library settings:', error);
        throw error;
    }
};

// Run the complete seeder
const runCompleteSeeder = async () => {
    try {
        await connectDB();
        
        console.log('🚀 Starting complete seeder...\n');
        
        // Step 1: Create academic year
        console.log('📅 Step 1: Creating academic year...');
        const academicYear = await createAcademicYear();
        
        // Step 2: Create library settings
        console.log('\n📚 Step 2: Creating library settings...');
        await seedLibrarySettings(academicYear);
        
        console.log('\n✅ Complete seeder finished successfully!');
        console.log('🎉 Library system is now ready to use.');
        
    } catch (error) {
        console.error('❌ Seeder failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
};

// Run if this file is executed directly
if (require.main === module) {
    runCompleteSeeder();
}

module.exports = { runCompleteSeeder };
