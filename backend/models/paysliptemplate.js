'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PayslipTemplate extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  PayslipTemplate.init({
    companyName: DataTypes.STRING,
    companyLogo: DataTypes.STRING,
    companyAddress: DataTypes.TEXT,
    companyContact: DataTypes.STRING,
    footerText: DataTypes.TEXT,
    showEarningsBreakdown: DataTypes.BOOLEAN,
    showDeductionsBreakdown: DataTypes.BOOLEAN,
    showLeaveBalance: DataTypes.BOOLEAN,
    showEmployeeDetails: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'PayslipTemplate',
  });
  return PayslipTemplate;
};
