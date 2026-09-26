const Rack = require('../../models/Library/Rack');
const Book = require('../../models/Library/Book');
const catchAsync = require('../../utils/catchAsync');

// Create a new rack
exports.createRack = catchAsync(async (req, res) => {
    const rack = new Rack(req.body);
    await rack.save();
    res.status(201).json(rack);
});

// Get all racks
exports.getRacks = catchAsync(async (req, res) => {
    const racks = await Rack.find({ isActive: true })
        .sort({ rackNumber: 1 });
    res.status(200).json(racks);
});

// Get a single rack by ID
exports.getRackById = catchAsync(async (req, res) => {
    const rack = await Rack.findById(req.params.id);
    
    if (!rack) {
        return res.status(404).json({ message: 'Rack not found' });
    }
    res.status(200).json(rack);
});

// Update a rack by ID
exports.updateRack = catchAsync(async (req, res) => {
    const rack = await Rack.findByIdAndUpdate(req.params.id, req.body, { 
        new: true,
        runValidators: true 
    });
    
    if (!rack) {
        return res.status(404).json({ message: 'Rack not found' });
    }
    res.status(200).json(rack);
});

// Delete a rack by ID (soft delete)
exports.deleteRack = catchAsync(async (req, res) => {
    const rackId = req.params.id;

    // Check if rack exists
    const rack = await Rack.findById(rackId);
    if (!rack) {
        return res.status(404).json({ message: 'Rack not found' });
    }

    // Check if any books are assigned to this rack
    const booksInRack = await Book.find({ rack: rackId, isActive: true });
    if (booksInRack.length > 0) {
        return res.status(400).json({ 
            message: `Cannot delete rack. There are ${booksInRack.length} book(s) assigned to this rack. Please reassign or remove the books first.` 
        });
    }

    // Soft delete by setting isActive to false
    await Rack.findByIdAndUpdate(rackId, { isActive: false });
    res.status(200).json({ message: 'Rack deleted successfully' });
});

// Get rack statistics
exports.getRackStats = catchAsync(async (req, res) => {
    const rackId = req.params.id;
    
    const rack = await Rack.findById(rackId);
    if (!rack) {
        return res.status(404).json({ message: 'Rack not found' });
    }

    const totalBooks = await Book.countDocuments({ rack: rackId, isActive: true });
    const availableBooks = await Book.countDocuments({ 
        rack: rackId, 
        status: 'available', 
        isActive: true 
    });
    const issuedBooks = await Book.countDocuments({ 
        rack: rackId, 
        status: 'issued', 
        isActive: true 
    });

    const stats = {
        rack: rack,
        totalBooks,
        availableBooks,
        issuedBooks,
        utilizationRate: rack.numberOfRows > 0 ? (totalBooks / rack.numberOfRows) * 100 : 0
    };

    res.status(200).json(stats);
});
