"use strict";

var _functions = _interopRequireDefault(require("@architect/functions"));

var _graphqlYoga = require("graphql-yoga");

require("./env");

var _graphqlTools = require("graphql-tools");

var _graphql = require("graphql");

var _graphqlTypeJson = _interopRequireWildcard(require("graphql-type-json"));

var _dateformat = _interopRequireDefault(require("dateformat"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const rootValue = {
  ip: function (args, request) {
    return request.ip;
  },
  host: function (args, request) {
    return request.get('host');
  }
};

class FormattableDateDirective extends _graphqlTools.SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const {
      resolve = _graphql.defaultFieldResolver
    } = field;
    const {
      defaultFormat
    } = this.args;
    field.args.push({
      name: 'format',
      type: _graphql.GraphQLString
    });

    field.resolve = async function (source, {
      format,
      ...otherArgs
    }, context, info) {
      const date = await resolve.call(this, source, otherArgs, context, info); // If a format argument was not provided, default to the optional
      // defaultFormat argument taken by the @date directive:

      return date ? (0, _dateformat.default)(date, format || defaultFormat) : null;
    };

    field.type = _graphql.GraphQLString;
  }

}

let typeDefs = `
  type Query {
    hello: String
  }
`;
let resolvers = {
  Query: {
    hello: () => 'Hello world!'
  }
};
const server = new _graphqlYoga.GraphQLServerLambda({
  GraphQLJSONObject: _graphqlTypeJson.GraphQLJSONObject,
  GraphQLJSON: _graphqlTypeJson.default,
  typeDefs,
  resolvers,
  resolverValidationOptions: {
    requireResolversForResolveType: false
  },
  rootValue,
  schemaDirectives: {
    date: FormattableDateDirective
  }
});

exports.handler = function (req, res, next) {
  const body = _functions.default.http.helpers.bodyParser(req); // Body is now parsed, re-encode to JSON for Apollo


  req.body = JSON.stringify(body);
  server.handler(req, res, next);
};