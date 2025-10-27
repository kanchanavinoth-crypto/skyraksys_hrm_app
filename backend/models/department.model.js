module.exports = (sequelize, DataTypes) => {
  const Department = sequelize.define('Department', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'departments',
    timestamps: true
  });

  Department.associate = function(models) {
    Department.hasMany(models.Employee, {
      foreignKey: 'departmentId',
      as: 'employees'
    });
    
    Department.hasMany(models.Position, {
      foreignKey: 'departmentId',
      as: 'positions'
    });
  };

  return Department;
};
