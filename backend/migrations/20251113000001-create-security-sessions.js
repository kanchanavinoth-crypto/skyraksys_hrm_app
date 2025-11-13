'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('security_sessions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      sessionId: {
        type: Sequelize.STRING(128),
        allowNull: false,
        unique: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      ipAddress: {
        type: Sequelize.INET,
        allowNull: true
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      deviceFingerprint: {
        type: Sequelize.STRING(64),
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      loginAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      lastActivityAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      logoutAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      logoutReason: {
        type: Sequelize.ENUM('USER_LOGOUT', 'FORCED_LOGOUT', 'SECURITY_VIOLATION', 'TIMEOUT', 'ADMIN_LOGOUT'),
        allowNull: true
      },
      riskScore: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      locationCountry: {
        type: Sequelize.STRING(2),
        allowNull: true
      },
      locationCity: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      warningCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add indexes
    await queryInterface.addIndex('security_sessions', ['sessionId']);
    await queryInterface.addIndex('security_sessions', ['userId']);
    await queryInterface.addIndex('security_sessions', ['isActive']);
    await queryInterface.addIndex('security_sessions', ['loginAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('security_sessions');
  }
};