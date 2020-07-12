"use strict";

module.exports = (sequelize, DataTypes) => {
	let Children = sequelize.define("children", {
		id: { allowNull: false, autoIncrement: true, primaryKey: true, type: DataTypes.INTEGER },
		name: { type: DataTypes.STRING, allowNull: true },
		birthday: { type: DataTypes.DATE, allowNull: true },
		parent_id: { type: DataTypes.UUID, allowNull: false },
		is_active: { type: DataTypes.BOOLEAN,  allowNull: false },
		delivery_date: { type: DataTypes.DATE, allowNull: true },
		gender: { type: DataTypes.STRING, allowNull: false },
		isPregnancy: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
		is_feature: { type: DataTypes.BOOLEAN, allowdNull: false, defaultValue: false },
		is_twin: { type: DataTypes.BOOLEAN, allowdNull: false, defaultValue: false },
		twin_name: { type: DataTypes.STRING, allowNull: true, defaultValue: "" },
	}, {
		freezeTableName: true,
		underscored: true,
		timestamps: true
	});

	Children.associate = function(models) {
		Children.belongsTo(models.user, { foreignKey: 'parent_id' });
	};

	Children.sync({ force: false })
		.then(function (err) { 
			if(err) { 
				console.log("An error occur while creating table"); 
			} else { 
				console.log("Item table created successfully"); 
			} 
		});

	return Children;
};
