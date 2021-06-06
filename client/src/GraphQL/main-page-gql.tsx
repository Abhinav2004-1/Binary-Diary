import { gql } from "@apollo/client";

export const FetchUserData = gql`
  query ($id: String!) {
    GetUserData(id: $id) {
      Username
    }
  }
`;