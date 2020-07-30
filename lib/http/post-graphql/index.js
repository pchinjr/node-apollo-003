import arc from '@architect/functions';
import {  GraphQLServerLambda } from 'graphql-yoga';
import './env';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { defaultFieldResolver, GraphQLString } from 'graphql';
import GraphQLJSON, { GraphQLJSONObject } from 'graphql-type-json';
import formatDate from 'dateformat';

const rootValue = {
  ip: function (args, request) {
    return request.ip;
  },
  host: function (args, request) {
    return request.get('host');
  },
};

class FormattableDateDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { resolve = defaultFieldResolver } = field;
    const { defaultFormat } = this.args;

    field.args.push({
      name: 'format',
      type: GraphQLString,
    });

    field.resolve = async function (source, { format, ...otherArgs }, context, info) {
      const date = await resolve.call(this, source, otherArgs, context, info);
      // If a format argument was not provided, default to the optional
      // defaultFormat argument taken by the @date directive:

      return date ? formatDate(date, format || defaultFormat) : null;
    };

    field.type = GraphQLString;
  }
}


let typeDefs = `
  type Query {
    hello: String
  }
`

let resolvers = {
  Query: {
    hello: () => 'Hello world!',
  },
}



const server = new GraphQLServerLambda({
  GraphQLJSONObject,
  GraphQLJSON,
  typeDefs,
  resolvers,
  resolverValidationOptions: {
    requireResolversForResolveType: false,
  },
  rootValue,
  schemaDirectives: {
    date: FormattableDateDirective,
  },
});




exports.handler = function (req, res, next) {
  const body = arc.http.helpers.bodyParser(req);
  // Body is now parsed, re-encode to JSON for Apollo
  req.body = JSON.stringify(body);
  server.handler(req, res, next);
}
