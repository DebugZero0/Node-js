import React, { useEffect } from "react";
import { useProduct } from "../hook/useProduct";
import { useSelector } from "react-redux";
import {
  Package,
  DollarSign,
  CheckCircle,
  Search,
} from "lucide-react";

const Dashboard = () => {
  const { handleGetSellerProducts, isLoading, error } = useProduct();

  const sellerProducts = useSelector(
    (state) => state.product.sellerProducts
  );

  useEffect(() => {
    handleGetSellerProducts();
  }, []);

  const totalProducts = sellerProducts.length;

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-white px-4 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">

        {/* Header */}

        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Dashboard
            </h1>

            <p className="mt-2 text-zinc-400">
              Manage all your products from one place.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
              size={18}
            />

            <input
              placeholder="Search products..."
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-yellow-500"
            />
          </div>
        </div>

        {/* Stats */}

        <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            icon={<Package size={22} />}
            title="Products"
            value={totalProducts}
          />
          
        </div>

        {isLoading && (
          <div className="py-20 text-center text-zinc-400">
            Loading Products...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        )}

        {!isLoading && sellerProducts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 py-24 text-center">
            <Package
              size={60}
              className="mx-auto mb-4 text-zinc-500"
            />

            <h2 className="text-xl font-semibold">
              No Products Yet
            </h2>

            <p className="mt-2 text-zinc-500">
              Your products will appear here.
            </p>
          </div>
        )}

        {!isLoading && sellerProducts.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {sellerProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

function StatCard({ icon, title, value }) {
  return (
    <div
      className="
      rounded-2xl
      border border-white/10
      bg-white/5
      backdrop-blur-xl
      p-6
      transition
      hover:border-yellow-500/40
    "
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-500">
        {icon}
      </div>

      <p className="text-sm text-zinc-400">{title}</p>

      <h2 className="mt-2 text-3xl font-bold">{value}</h2>
    </div>
  );
}

function ProductCard({ product }) {
  return (
    <div
      className="
      overflow-hidden
      rounded-2xl
      border border-white/10
      bg-white/5
      backdrop-blur-xl
      transition
      hover:border-yellow-500/50
    "
    >
      <img
        src={product.images?.[0]?.url}
        alt={product.title}
        className="h-60 w-full object-cover"
      />

      <div className="space-y-4 p-6">

        <div>
          <h2 className="line-clamp-1 text-xl font-semibold">
            {product.title}
          </h2>

          <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
            {product.description}
          </p>
        </div>

        <div className="flex items-center justify-between">

          <div>
            <p className="text-xs text-zinc-500">
              Price
            </p>

            <h3 className="text-lg font-bold text-yellow-500">
              {product.price.currency} {product.price.amount}
            </h3>
          </div>

          <span
            className="
            rounded-full
            border border-yellow-500/20
            bg-yellow-500/10
            px-3
            py-1
            text-xs
            font-medium
            text-yellow-400
          "
          >
            Active
          </span>

        </div>

        <button
          className="
          w-full
          rounded-xl
          border border-yellow-500
          py-3
          text-sm
          font-semibold
          text-yellow-500
          transition
          hover:bg-yellow-500
          hover:text-black
        "
        >
          View Details
        </button>
      </div>
    </div>
  );
}