/**
 * Label Component
 * Styled with Tailwind CSS
 */

import * as React from 'react';
import { cn } from '../../utils/cn';

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn('block text-sm font-medium text-text-primary mb-1.5', className)}
        {...props}
      />
    );
  }
);

Label.displayName = 'Label';

export { Label };