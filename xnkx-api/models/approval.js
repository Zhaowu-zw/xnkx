'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class approval extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // 关联申请人
      models.approval.belongsTo(models.user, {
        foreignKey: 'applicant_id',
        as: 'applicant',
        onDelete: 'RESTRICT'
      });
      // 关联审批人
      models.approval.belongsTo(models.user, {
        foreignKey: 'approver_id',
        as: 'approver',
        onDelete: 'SET NULL'
      });
    };
    
  }
  approval.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    approval_type: {
      type: DataTypes.ENUM('recruitment', 'permission'),
      allowNull: false
    },
    applicant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'RESTRICT'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    approval_node: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    approval_status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
      allowNull: false
    },
    approver_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    }
  }, {
    sequelize,
    modelName: 'approval',
    indexes: [
      { fields: ['approval_type'] },
      { fields: ['applicant_id'] },
      { fields: ['approval_node'] },
      { fields: ['approval_status'] },
      { fields: ['approver_id'] }
    ]
  });
  return approval;
};