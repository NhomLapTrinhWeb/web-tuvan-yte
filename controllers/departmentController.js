// Controller khoa/chuyên khoa
const { Department, Doctor } = require('../models');

exports.index = async (req, res) => {
  try {
    const departments = await Department.findAll({
      where: { isActive: true },
      include: [Doctor]
    });

    res.render('departments/list', { departments });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};
