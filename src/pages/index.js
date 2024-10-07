import { withSessionSsr } from "../lib/session";
import Home from '../components/global-components/Home';

export const getServerSideProps = withSessionSsr(
  async function getServerSideProps({ req }) {
    const user = req.session.user;

    if (user === undefined) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    return {
      props: { user },
    };
  }
);

export default function Index({ user }) {
  return <Home user={user} />;
}