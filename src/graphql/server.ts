import { ApolloServer } from 'apollo-server'

import { typeDefs } from '@src/graphql/schema'
import { resolvers } from '@src/graphql/resolver'
import { ApolloCtx } from '@src/defs'
import { helper } from '@src/helper'
import { blockchain } from '@src/blockchain'

const chainIdHeader = 'chain-id'
const authHeader = 'auth-signature'

const createContext = (ctx: any): ApolloCtx => {
  const { req: request, connection } = ctx
  // * For subscription and query-mutation, gql handles headers differently 😪
  const headers = connection && connection.context ? connection.context : request.headers

  const chainId = headers[chainIdHeader] || null
  const authSignature = headers[authHeader] || null
  let address: string = null
  let userId: string = null
  if (authSignature !== null) {
    address = blockchain.getAddressFromSignature(authSignature)
    userId = helper.toCompositeKey(chainId, address)
  }

  return {
    userId,
    address,
    chainId,
  }
}

let server: ApolloServer

export const start = async (port: number): Promise<void> => {
  if (server) {
    return
  }

  server = new ApolloServer({
    cors: true,
    resolvers: resolvers,
    typeDefs: typeDefs(),
    context: createContext,
  })
  const { url } = await server.listen(port)
  console.log(`🚀  Server ready at ${url}`)
}

export const stop = (): Promise<void> => {
  if (!server) {
    return
  }
  return server.stop()
}
