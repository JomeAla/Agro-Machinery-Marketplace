export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-700">Agro Market</h1>
          <p className="text-gray-600 mt-2">Agricultural Machinery B2B Marketplace</p>
        </div>
        {children}
      </div>
    </div>
  );
}
