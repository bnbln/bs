import type { GetServerSideProps } from 'next'

export const requireAdminServerSideProps: GetServerSideProps = async () => {
  if (process.env.NODE_ENV !== 'development' || process.env.NEXT_PUBLIC_ADMIN !== 'true') {
    return { notFound: true }
  }

  return { props: {} }
}
