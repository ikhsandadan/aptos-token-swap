"use client";
import { usePathname } from 'next/navigation';
import Frontpage from './Frontpage/page';

export default function Home() {
  const pathName = usePathname();
  return (
    <>
      {pathName === '/' && <Frontpage />}
    </>
  );
}
