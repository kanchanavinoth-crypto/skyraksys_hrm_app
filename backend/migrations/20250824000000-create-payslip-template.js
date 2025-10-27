'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PayslipTemplates', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      companyName: {
        type: Sequelize.STRING,
        defaultValue: 'Skyraksys'
      },
      companyLogo: {
        type: Sequelize.STRING
      },
      companyAddress: {
        type: Sequelize.TEXT
      },
      companyContact: {
        type: Sequelize.STRING
      },
      footerText: {
        type: Sequelize.TEXT
      },
      showEarningsBreakdown: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      showDeductionsBreakdown: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      showLeaveBalance: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      showEmployeeDetails: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: new Date()
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: new Date()
      }
    });

    // Seed initial default template
    await queryInterface.bulkInsert('PayslipTemplates', [{
      companyName: 'Your Company Name',
      companyAddress: '123 Business Rd, Business City, 12345',
      companyContact: 'contact@yourcompany.com',
      footerText: 'This is a computer-generated document.',
      showEarningsBreakdown: true,
      showDeductionsBreakdown: true,
      showLeaveBalance: true,
      showEmployeeDetails: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PayslipTemplates');
  }
};
