import { Store, DollarSign, ShoppingBag, CheckCircle2 } from 'lucide-react';
import PropTypes from 'prop-types';

const OrderConfirmationCard = ({ orderData }) => {
  // Handle both string and object formats
  const orderInfo = typeof orderData === 'string' 
    ? { message: orderData } 
    : orderData;

  const { bill, message } = orderInfo;

  return (
    <div className="space-y-4">
      {/* Message */}
      {message && (
        <div className="bg-white/10 rounded-lg p-4 border border-white/20 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="text-white" size={20} />
            <span className="font-semibold text-white">Order Status</span>
          </div>
          <p className="text-white text-base leading-relaxed">{message}</p>
        </div>
      )}

      {/* Bill Details */}
      {bill && (
        <div className="bg-white/10 rounded-lg border border-white/20 backdrop-blur-sm overflow-hidden">
          {/* Restaurant Header */}
          <div className="bg-white/5 px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Store className="text-white" size={18} />
              <span className="font-bold text-white text-lg">{bill.restaurant_name}</span>
            </div>
          </div>

          {/* Order Items */}
          <div className="p-4 space-y-3">
            {bill.items && bill.items.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="text-green-200" size={16} />
                      <span className="font-semibold text-white">{item.name}</span>
                      {item.quantity > 1 && (
                        <span className="text-xs px-2 py-0.5 bg-white/20 text-white rounded-full">
                          x{item.quantity}
                        </span>
                      )}
                    </div>
                    {item.customizations && (
                      <div className="mt-1 ml-6 text-xs text-green-200/80 italic">
                        {item.customizations}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-white font-bold">
                    <DollarSign size={16} />
                    <span>{item.price.toFixed(2)}</span>
                  </div>
                </div>
                {index < bill.items.length - 1 && (
                  <div className="border-b border-white/10"></div>
                )}
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="bg-white/5 px-4 py-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-lg">Total</span>
              <div className="flex items-center gap-1 text-white font-bold text-xl">
                <DollarSign size={20} />
                <span>{bill.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

OrderConfirmationCard.propTypes = {
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default OrderConfirmationCard;
