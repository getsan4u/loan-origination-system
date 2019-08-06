'use strict';

const periodic = require('periodicjs');
const Promisie = require('promisie');
const logger = periodic.logger;
const moment = require('moment');

async function getAllTeamMembersForOrganizationByName(req, res, next) {
  req.controllerData = req.controllerData || {};
  const TeamMember = periodic.datas.get('standard_user');
  const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
  req.controllerData.team_members = await TeamMember.model.find({ 'association.organization': organization._id, }).lean();
  req.controllerData.teamMemberMapByName = {};
  req.controllerData.team_members.forEach(member => {
    const full_name = `${member.first_name} ${member.last_name}`;
    req.controllerData.teamMemberMapByName[ full_name ] = member;
  });
  return next();
}

async function getAllTeamMembersForOrganizationById(req, res, next) {
  req.controllerData = req.controllerData || {};
  const TeamMember = periodic.datas.get('standard_user');
  const organization = (req.user && req.user.association && req.user.association.organization) ? req.user.association.organization : null;
  req.controllerData.team_members = await TeamMember.model.find({ 'association.organization': organization._id, }).lean();
  req.controllerData.teamMemberMapById = {};
  req.controllerData.team_members.forEach(member => {
    req.controllerData.teamMemberMapById[ member._id.toString() ] = member;
  });
  return next();
}

module.exports = {
  getAllTeamMembersForOrganizationByName,
  getAllTeamMembersForOrganizationById,
};