// pure business rules, no AI calls, no database writes

function evaluateUpsell({ product }) {
  if (!product.isUpsellEligible) {
    return {
      status: 'rejected',
      ruleReason: 'Product is not marked upsell-eligible by the merchant.'
    };
  }
  return {
    status: 'auto_approved',
    ruleReason: 'Upsell suggestions are pre-approved by the merchant for eligible products.'
  };
}

function evaluateDiscount({ discountPercent, merchant }) {
  if (discountPercent > merchant.maxDiscountPercent) {
    return {
      status: 'rejected',
      ruleReason: `Requested ${discountPercent}% exceeds the merchant's hard cap of ${merchant.maxDiscountPercent}%.`
    };
  }
  if (discountPercent <= merchant.discountApprovalThreshold) {
    return {
      status: 'auto_approved',
      ruleReason: `${discountPercent}% is within the auto-approval threshold of ${merchant.discountApprovalThreshold}%.`
    };
  }
  return {
    status: 'pending_approval',
    ruleReason: `${discountPercent}% exceeds the auto-approval threshold (${merchant.discountApprovalThreshold}%) but is within the merchant's max (${merchant.maxDiscountPercent}%), so it needs sign-off.`
  };
}

module.exports = { evaluateUpsell, evaluateDiscount };