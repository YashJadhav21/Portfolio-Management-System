// Generic CRUD factory for simple models
// Usage: createCRUDController(Model, populateFields)

const createCRUDController = (Model, populateFields = []) => {
  // GET all with search + pagination
  const getAll = async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '', status } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build filter
      const filter = {};
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }
      if (status) filter.status = status;

      let query = Model.find(filter).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 });

      // Populate referenced fields
      for (const field of populateFields) {
        query = query.populate(field);
      }

      const [data, total] = await Promise.all([query, Model.countDocuments(filter)]);

      res.status(200).json({
        success: true,
        data,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // GET one by ID
  const getOne = async (req, res) => {
    try {
      let query = Model.findById(req.params.id);
      for (const field of populateFields) {
        query = query.populate(field);
      }
      const item = await query;
      if (!item) return res.status(404).json({ success: false, message: 'Not found' });
      res.status(200).json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // CREATE
  const create = async (req, res) => {
    try {
      const item = await Model.create(req.body);
      res.status(201).json({ success: true, data: item, message: 'Created successfully' });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ success: false, message: 'Record already exists' });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // UPDATE
  const update = async (req, res) => {
    try {
      const item = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!item) return res.status(404).json({ success: false, message: 'Not found' });
      res.status(200).json({ success: true, data: item, message: 'Updated successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // DELETE
  const remove = async (req, res) => {
    try {
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: 'Not found' });
      res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  return { getAll, getOne, create, update, remove };
};

module.exports = createCRUDController;
