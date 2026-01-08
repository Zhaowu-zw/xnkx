'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class userinfo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.userinfo.belongsTo(models.user, { foreignKey: 'user_id' });
    }
  }
  userinfo.init({
    id:{
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      comment: '主键ID,无符号自增',
    },
    user_id: {
      type: DataTypes.INTEGER,
      unsigned: true,
      allowNull: false,
    },
    nickname: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: { args: [2, 15], msg: "昵称长度必须在2到15个字符之间" },
        is: {
          args: /^[\u4e00-\u9fa5]+$/,
          msg: "用户名只能包含中文"
        },
      },
    },
    age: {
      type: DataTypes.INTEGER,
      unsigned: true,
      allowNull: true,
      validate: {
        min: { args: [0], msg: "年龄不能小于0" },
        max: { args: [100], msg: "年龄不能大于150" },
      },
    },
    sex: {
      type: DataTypes.ENUM('男', '女','未知'),
      allowNull: false,
      defaultValue: '未知',
      validate: {
        isIn: {
          args: [['男', '女','未知']],
          msg: "性别必须是 '男', '女' 或 '未知'"
        }
      }
    },
    hobbit: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: { args: [0, 100], msg: "兴趣爱好不能超过100个字符" }
      }
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: "http://localhost:3000/upload/avatar/avatar_20192631-2f21-4cbb-a1e9-cc3bc2b5f975_1765454810421.png",
      validate: {
        isUrlOrEmpty: function (value) {
          // 空值直接通过（allowNull: true）
          if (!value) return true;
          // 兼容 localhost/IP/域名、带下划线/短横线的路径、无端口/有端口的URL
          const urlRegex = /^(https?:\/\/)?((localhost)|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})|([\da-z.-]+\.[a-z.]{2,6}))(:\d{1,5})?([\/\w\-._~:?#[\]@!$&'()*+,;=]*)$/i;
          if (!urlRegex.test(value)) {
            throw new Error("头像 URL 格式无效");
          }
        }
      }
      
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: { args: [0, 500], msg: "个人描述不能超过500个字符" }
      }
    },
    telephone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: {
          args: /^1[3-9]\d{9}$/,
          msg: "电话号码格式不正确"
        }
      }
    }
    ,
    department: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: { args: [0, 100], msg: "院系长度不能超过100个字符" }
      }
    },
    grade: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: { args: [0, 20], msg: "年级长度不能超过20个字符" }
      }
    },
    student_number: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: { args: [0, 30], msg: "学号长度不能超过30个字符" }
      }
    }
  }, {
    sequelize,
    modelName: 'userinfo',
    indexes: [
      { fields: ['user_id'] },
    ]
  });
  return userinfo;
};