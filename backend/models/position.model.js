module.exports = (sequelize, DataTypes) => {
  const Position = sequelize.define('Position', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    level: {
      type: DataTypes.ENUM('Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director'),
      defaultValue: 'Junior'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'positions',
    timestamps: true
  });

  Position.associate = function(models) {
    Position.belongsTo(models.Department, {
      foreignKey: 'departmentId',
      as: 'department'
    });
    
    Position.hasMany(models.Employee, {
      foreignKey: 'positionId',
      as: 'employees'
    });
  };

  return Position;
};
