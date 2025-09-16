import Link from "next/link";
import Image from "next/image";
import { EchoWidget } from '@/components/echo-tokens';
import { isSignedIn } from '@/echo';

export default async function Header() {
  const _isSignedIn = await isSignedIn();
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/icon.png"
                alt="ColorForge"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-xl font-semibold text-gray-900">
                ColorForge
              </span>
            </Link>
          </div>

          <div className="flex items-center">
            {_isSignedIn && <EchoWidget />}
          </div>
        </div>
      </div>
    </header>
  );
}