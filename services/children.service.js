/* eslint-disable no-mixed-spaces-and-tabs */
"use strict";
require("dotenv").config();

const Sequelize = require("sequelize");
const { MoleculerClientError } = require("moleculer").Errors;
const Op = Sequelize.Op;
const Children = require("../models").children;

module.exports = {
	name: "child",
	logger: console,

	mixins: [

	],


	/**
	 * Service settings
	 */
	settings: {
		
	},

	/**
	 * Service dependencies
	 */
	dependencies: [
		
	],	

	registry: {
		strategy: "RoundRobin"
	},

	/**
	 * Actions
	 */
	actions: {
		updateACData: {
			async handler(ctx) {
				const { user }  = ctx.meta;
				const { params } = ctx;
				try { 
					await Children.update(
					   { 
						   active_campaign_child_index: params.data.active_campaign_child_index,
					   },
					   {  where: { parent_id: user.id, id: params.data.id }, 
							returning: true, 
							plain: true
						});
   
				   return { message: "success",code: 200,data: {} };
			   } catch (e) {
				   console.log(e);
			   }
			}
		},

		getChild: {
			async handler(ctx) {
				const { user }  = ctx.meta;
				let children = await this.getChildren(false, user);
				return { message:"success", code:200, data: children };
			}
		},
		featureChild: {
			cache:{
				enabled: false
			},
			params:{
				child_id: { min: 1, max: 255, type: "string"  },
				noRefresh: { min: 1, max: 255, type: "string", optional: true },
			},
			async handler(ctx) {

				const { user }  = ctx.meta;
				const { params } = ctx;
				
				try { 
					await Children.update(
						{ is_feature: false },
						{  where: { parent_id: user.id } }
					);
					
					await Children.update(
						{ is_feature: true },
						{ where: { parent_id: user.id, id: params.child_id  } }
					);

					return { message: "success",code: 200,data: {} };

				} catch (e) {
					console.log(e);
				}
			}
		},
		updateChildProfile: {
			params:{
				id: { min: 1, max: 255, type: "string"  },
				name: { min: 1, max: 255, type: "string" },
				date: { type: "string", optional: false },
				gender: { min: 1, max: 2, type: "string", pattern : "[mfumi]" }
			},
			async handler(ctx) {
				const { user }  = ctx.meta;
				const { params } = ctx;
				
				try { 
					await Children.update(
						{ 
							delivery_date: Sequelize.literal(`CASE WHEN is_pregnancy = true THEN TO_DATE(CAST('${params.date}' AS TEXT), 'YYYY-MM-DD') ELSE NULL END`),
							birthday: Sequelize.literal(`CASE WHEN is_pregnancy = false THEN TO_DATE(CAST('${params.date}' AS TEXT), 'YYYY-MM-DD') ELSE NULL END`),  
							name: params.name,
							gender: params.gender,
							updatedAt: new Date()
						},
						{  where: { parent_id: user.id, id: params.id }, 
							returning: true, 
							raw: true
						});

					return { message: "success",code: 200,data: {} };
				} catch (e) {
					console.log(e);
				}
			}
		},
		addChild: {
			cache:{
				enabled: false
			},
			params:{
				name: { type: "string", optional: true  },
				birthday: { min: 0, max: 255,  type: "string", empty:true, convert:true, optional: true  },
				delivery_date: { min: 0, optional: true, type: "string", convert: true  },
				gender: {  min: 1, max: 2, type: "string", pattern : "[mfumi]"  },
				isTwin: { type: "string", optional: false, pattern : "[01]" },
				twin_name: { type: "string", optional: true }
			},
			async handler(ctx) {
				const { user }  = ctx.meta;
				const { params } = ctx;

				let children = await this.getChildren(true, user);
				let pregnancyData = await children.filter(child => { if (child.isPregnancy === true && child.name === params.name) return child; });
				let hasNoData = await children.filter(child => { if ( child.name === params.name ) return child; });
				let hasNoValue = await children.filter(child => { if ( child.name === "" ) return child; });

				if (_.has(params, "delivery_date") && _.has(params, "birthday")) {
					return  new MoleculerClientError("", 422, "Please choose birthday or dob.", [{ field: "dob/birthday", message: "Please choose birthday or dob." }]);
				}
                
				if(hasNoData.length > 0){
					try{

						let updateParams = { 
							delivery_date: params.delivery_date ? params.delivery_date : null,
							birthday: params.delivery_date ? null : params.birthday,  
							name: params.name,
							gender: params.gender,
							isPregnancy: _.has(params, "delivery_date") ? true : false,
							isTwin: parseInt(params.isTwin) === 1 ? true : false,
							twin_name: params.twin_name,
							updatedAt: new Date()
						};

						let child = await Children.update(updateParams,{ where: { parent_id: user.id, id: hasNoData[0].id }, returning: true, raw: true });
						return { message: "success",code: 200, data: child[1] };
					} catch (e) {
						console.log(e); 
					}
				} else if (hasNoValue.length > 0) {
					let updateParams = { 
						delivery_date: params.delivery_date ? params.delivery_date : null,
						birthday: params.delivery_date ? null : params.birthday,  
						name: params.name,
						gender: params.gender,
						isPregnancy: _.has(params, "delivery_date") ? true : false,
						isTwin: parseInt(params.isTwin) === 1 ? true : false,
						twin_name: params.twin_name,
						updatedAt: new Date()
					};

					let child = await Children.update(updateParams,{ where: { parent_id: user.id, id: hasNoValue[0].id }, returning: true, raw: true });
	
					return { message: "success",code: 200, data: child[1] };
				}
			
				if(params.name === ""){
					params.name = "Suprise!!";
				}

				params.is_active = true;
				params.parent_id = user.id;
				params.created_at = new Date();
				params.updated_at = new Date();

				if(_.has(params, "delivery_date")){
					params.isPregnancy = true;

					if (pregnancyData.length === 1) {
						return  new MoleculerClientError("", 422, "Number of pregnancy already exceeds.", [{ field: "children", message: "Number of pregnancy exceeds." }]);
					}
				} else {
					params.isPregnancy = false;
				}

				if(parseInt(params.isTwin) === 1) {
					params.is_twin = parseInt(params.isTwin) === 1 ? true : false;
				}


				if(children.length === 0){
					params.is_feature = true;
				} else {
					let featureChild = children.find(item => item.is_feature === true);
					if(featureChild === null || featureChild === undefined){
						params.is_feature = true;
					} 
				}

				try{
					let child = await Children.create(params);
					return { message:"success",code:200,data:[child] };
				} catch (e) {
					console.log(e); 
				}
			}
		},
		removeChild : {
			cache:{
				enabled: false
			},
			params:{
				child_id: { min: 1, max: 255, type: "string"  }
			},
			async handler(ctx) {
				const { user }  = ctx.meta;
				const { params } = ctx;
				try { 
					 await Children.update(
						{ 
							delivery_date: null,
							birthday: null,  
							name: "",
							gender: "",
							is_feature: false,
							is_twin: false,
							twin_name: "",
							isPregnancy: null,
							updatedAt: new Date(),
						},
						{ where: { id: params.child_id, parent_id: user.id }, 
							returning: true, 
							raw: true
						});
					return { message: "success",code: 200, data: {} };
				} catch (e) {
					console.log(e);
				}
			}
		}
	},

	/**
	 * Events
	 */
	events: {

	},

	/**
	 * Methods
	 */
	methods: {
		async getChildren(includeBlank, user){

			let queryParam = { 
				where: {
					parent_id: {
						[Op.eq]: user.id
					}
				},
				raw: true
			};

			if(!includeBlank){
				queryParam.where.name = { [Op.ne]: "" };
			}
			
			let children = await Children.findAll(
				queryParam, 
				{ 
					order: [
						Sequelize.literal("ORDER BY (CASE WHEN is_feature then 2 when is_feature is false then 1 end) ASC")
					]
				}
			);

			return children;
		},

		async getChildProfile(childID){
			let queryParam = { 
				where: {
					id: {
						[Op.eq]: childID
					}
				},
				raw: true
			};
			
			let children = await Children.findAll(
				queryParam
			);

			return children[0];
		}
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {
		this.broker.cacher.clean();
	},

	/**
	 * Service started lifecycle event handler
	 */
	started() {
		this.broker.cacher.clean();
	},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {
		this.broker.cacher.clean();
	}
};